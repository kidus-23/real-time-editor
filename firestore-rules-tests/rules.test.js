/**
 * Security-rules tests for Real Time Editor (real-time-editor-8824b).
 *
 * Every "allow" case below mirrors a call that exists in the app's client
 * code (V3/editor), replayed through an UNAUTHENTICATED context because the
 * browser never signs in to Firebase Auth. The "deny" cases are the
 * hardening the new rules add over the expiring test-mode rules.
 *
 * Run:  firebase emulators:exec --only firestore "npx mocha rules.test.js"
 */
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  collectionGroup,
  getDocs,
  serverTimestamp,
  Timestamp,
} = require("firebase/firestore");

let testEnv;

const ROOM = "room123";
const MY_EMAIL = "me@example.com";
const OTHER_EMAIL = "other@example.com";
const EMULATOR_PORT = parseInt(process.env.FIRESTORE_EMULATOR_PORT || "9090", 10);

function client() {
  return testEnv.unauthenticatedContext().firestore();
}

// Write test fixtures without triggering rules (what the Admin SDK does in prod)
async function seed(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-rte-rules",
    firestore: {
      rules: fs.readFileSync(
        path.join(__dirname, "..", "firestore.rules"),
        "utf8"
      ),
      host: "127.0.0.1",
      port: EMULATOR_PORT,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("documents/{roomId}", () => {
  beforeEach(async () => {
    await seed((db) =>
      setDoc(doc(db, "documents", ROOM), {
        title: "My Doc",
        content: "Some content",
        tags: ["a", "b"],
        createdAt: Timestamp.fromDate(new Date("2026-01-01")),
        lastOpened: Timestamp.fromDate(new Date("2026-01-01")),
      })
    );
  });

  describe("reads the app performs", () => {
    it("allows reading the live document (Document.tsx useDocumentData)", async () => {
      await assertSucceeds(getDoc(doc(client(), "documents", ROOM)));
    });

    it("allows the __name__ == roomId collection query (KnowledgeGraph.tsx)", async () => {
      await assertSucceeds(
        getDocs(
          query(collection(client(), "documents"), where("__name__", "==", ROOM))
        )
      );
    });
  });

  describe("writes the app performs", () => {
    it("allows updating only the title (Document.tsx updateTitle)", async () => {
      await assertSucceeds(
        updateDoc(doc(client(), "documents", ROOM), { title: "Renamed" })
      );
    });

    it("allows updating only tags (Document.tsx add/remove/AI tags)", async () => {
      await assertSucceeds(
        updateDoc(doc(client(), "documents", ROOM), { tags: ["x", "y", "z"] })
      );
    });
  });

  describe("hardening (must be denied)", () => {
    it("denies writing document content from the browser", async () => {
      await assertFails(
        updateDoc(doc(client(), "documents", ROOM), { content: "evil" })
      );
    });

    it("denies creating a document from the browser (server action only)", async () => {
      await assertFails(
        setDoc(doc(client(), "documents", "brandNewRoom"), { title: "hi" })
      );
    });

    it("denies deleting a document from the browser (server action only)", async () => {
      await assertFails(deleteDoc(doc(client(), "documents", ROOM)));
    });

    it("denies an oversized title", async () => {
      await assertFails(
        updateDoc(doc(client(), "documents", ROOM), {
          title: "x".repeat(2000),
        })
      );
    });

    it("denies an empty title", async () => {
      await assertFails(
        updateDoc(doc(client(), "documents", ROOM), { title: "" })
      );
    });

    it("denies an oversized tag list", async () => {
      await assertFails(
        updateDoc(doc(client(), "documents", ROOM), {
          tags: Array.from({ length: 60 }, (_, i) => `tag${i}`),
        })
      );
    });
  });

  describe("comments subcollection (server-managed)", () => {
    beforeEach(async () => {
      await seed((db) =>
        addDoc(collection(db, "documents", ROOM, "comments"), {
          resolved: false,
          createdAt: Timestamp.fromDate(new Date("2026-01-01")),
          userId: MY_EMAIL,
        })
      );
    });

    it("allows the resolved == false query (Document.tsx)", async () => {
      await assertSucceeds(
        getDocs(
          query(
            collection(client(), "documents", ROOM, "comments"),
            where("resolved", "==", false)
          )
        )
      );
    });

    it("allows the orderBy createdAt desc limit 50 query (CommentsSidebar.tsx)", async () => {
      await assertSucceeds(
        getDocs(
          query(
            collection(client(), "documents", ROOM, "comments"),
            orderBy("createdAt", "desc"),
            limit(50)
          )
        )
      );
    });

    it("denies creating a comment from the browser (server action only)", async () => {
      await assertFails(
        addDoc(collection(client(), "documents", ROOM, "comments"), {
          resolved: false,
          userId: MY_EMAIL,
        })
      );
    });
  });

  describe("versions subcollection (client autosave + cleanup)", () => {
    const OLD = Timestamp.fromDate(new Date("2026-01-01"));

    beforeEach(async () => {
      await seed((db) =>
        setDoc(doc(collection(db, "documents", ROOM, "versions")), {
          content: "old",
          title: "My Doc",
          timestamp: OLD,
          userId: "user_abc",
          userName: "Me",
        })
      );
    });

    it("allows the timestamp < cutoff cleanup query (Document.tsx)", async () => {
      await assertSucceeds(
        getDocs(
          query(
            collection(client(), "documents", ROOM, "versions"),
            where("timestamp", "<", Timestamp.fromDate(new Date()))
          )
        )
      );
    });

    it("allows a plain versions read (VersionHistory.tsx)", async () => {
      await assertSucceeds(
        getDocs(collection(client(), "documents", ROOM, "versions"))
      );
    });

    it("allows creating a version snapshot (Document.tsx autosave)", async () => {
      await assertSucceeds(
        setDoc(doc(collection(client(), "documents", ROOM, "versions")), {
          content: "snapshot",
          title: "My Doc",
          timestamp: Timestamp.now(),
          userId: "user_abc",
          userName: "Me",
        })
      );
    });

    it("allows deleting an old version (Document.tsx cleanup)", async () => {
      const snap = await getDocs(
        query(
          collection(client(), "documents", ROOM, "versions"),
          where("timestamp", "<", Timestamp.fromDate(new Date()))
        )
      );
      const ref = doc(client(), "documents", ROOM, "versions", snap.docs[0].id);
      await assertSucceeds(deleteDoc(ref));
    });

    it("denies updating a version (restores are server actions)", async () => {
      const snap = await getDocs(
        collection(client(), "documents", ROOM, "versions")
      );
      const ref = doc(client(), "documents", ROOM, "versions", snap.docs[0].id);
      await assertFails(
        updateDoc(ref, { content: "tampered" })
      );
    });

    it("denies a version with an unexpected extra field", async () => {
      await assertFails(
        setDoc(doc(collection(client(), "documents", ROOM, "versions")), {
          content: "snapshot",
          title: "My Doc",
          timestamp: Timestamp.now(),
          userId: "user_abc",
          userName: "Me",
          evil: true,
        })
      );
    });
  });
});

describe("teamChats/{roomId}/messages/{messageId}", () => {
  beforeEach(async () => {
    await seed((db) =>
      addDoc(collection(db, "teamChats", ROOM, "messages"), {
        content: "hello",
        userId: MY_EMAIL,
        userName: "Me",
        userAvatar: "https://example.com/a.png",
        timestamp: Timestamp.fromDate(new Date("2026-01-01")),
      })
    );
  });

  it("allows the orderBy timestamp asc read (Chatbar.tsx)", async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(client(), "teamChats", ROOM, "messages"),
          orderBy("timestamp", "asc")
        )
      )
    );
  });

  it("allows sending a message (Chatbar.tsx)", async () => {
    await assertSucceeds(
      addDoc(collection(client(), "teamChats", ROOM, "messages"), {
        content: "new message",
        userId: MY_EMAIL,
        userName: "Me",
        userAvatar: "https://example.com/a.png",
        timestamp: serverTimestamp(),
      })
    );
  });

  it("denies an oversized message", async () => {
    await assertFails(
      addDoc(collection(client(), "teamChats", ROOM, "messages"), {
        content: "x".repeat(20000),
        userId: MY_EMAIL,
        userName: "Me",
        userAvatar: "https://example.com/a.png",
        timestamp: serverTimestamp(),
      })
    );
  });

  it("denies a message with an unexpected extra field", async () => {
    await assertFails(
      addDoc(collection(client(), "teamChats", ROOM, "messages"), {
        content: "hi",
        userId: MY_EMAIL,
        userName: "Me",
        userAvatar: "",
        timestamp: serverTimestamp(),
        isAdmin: true,
      })
    );
  });

  it("denies editing an existing message", async () => {
    const snap = await getDocs(
      collection(client(), "teamChats", ROOM, "messages")
    );
    const ref = doc(client(), "teamChats", ROOM, "messages", snap.docs[0].id);
    await assertFails(updateDoc(ref, { content: "tampered" }));
  });

  it("denies deleting an existing message", async () => {
    const snap = await getDocs(
      collection(client(), "teamChats", ROOM, "messages")
    );
    const ref = doc(client(), "teamChats", ROOM, "messages", snap.docs[0].id);
    await assertFails(deleteDoc(ref));
  });
});

describe("users/{email}/rooms/{roomId} + collection-group reads", () => {
  beforeEach(async () => {
    await seed((db) =>
      setDoc(doc(db, "users", MY_EMAIL, "rooms", ROOM), {
        userId: MY_EMAIL,
        role: "owner",
        roomId: ROOM,
        lastOpened: Timestamp.fromDate(new Date("2026-01-01")),
      })
    );
  });

  it("allows reading own rooms collection (KnowledgeGraph.tsx)", async () => {
    await assertSucceeds(
      getDocs(collection(client(), "users", MY_EMAIL, "rooms"))
    );
  });

  it("allows the userId == filter collection-group query (HomePage.tsx search)", async () => {
    await assertSucceeds(
      getDocs(
        query(collectionGroup(client(), "rooms"), where("userId", "==", MY_EMAIL))
      )
    );
  });

  it("allows the roomId == filter collection-group query (useOwner.ts)", async () => {
    await assertSucceeds(
      getDocs(
        query(collectionGroup(client(), "rooms"), where("roomId", "==", ROOM))
      )
    );
  });

  it("denies writing room membership from the browser (server actions only)", async () => {
    await assertFails(
      setDoc(doc(client(), "users", MY_EMAIL, "rooms", "newRoom"), {
        userId: MY_EMAIL,
        role: "owner",
        roomId: "newRoom",
      })
    );
  });

  it("denies granting the caller a role on someone else's room", async () => {
    await assertFails(
      setDoc(doc(client(), "users", OTHER_EMAIL, "rooms", ROOM), {
        userId: OTHER_EMAIL,
        role: "owner",
        roomId: ROOM,
      })
    );
  });
});

describe("everything else", () => {
  it("denies reads and writes to unknown collections", async () => {
    const db = client();
    await assertFails(getDoc(doc(db, "admin", "config")));
    await assertFails(setDoc(doc(db, "admin", "config"), { x: 1 }));
    await assertFails(getDocs(collection(db, "somethingElse")));
  });
});
