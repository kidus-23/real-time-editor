
import React, { useState, useEffect } from "react";
import { Page, User } from "@/entities/all";
import { createPageUrl } from "@/utils";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  CheckSquare,
  Code,
  Palette,
  BookOpen,
  Users,
  Briefcase,
  Target,
  Lightbulb,
  Zap,
  Grid3X3
} from "lucide-react";

import TemplateCard from "../components/templates/TemplateCard";
import CreateTemplateModal from "../components/templates/CreateTemplateModal";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    loadTemplates();
  }, []);

  const loadUser = async () => {
    try {
      const userInfo = await User.me();
      setUser(userInfo);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadTemplates = async () => {
    // Load built-in templates and user-created templates
    const builtInTemplates = [
      {
        id: "meeting-notes",
        title: "Meeting Notes",
        description: "Structured template for meeting notes with agenda, participants, and action items",
        category: "productivity",
        icon: "📝",
        color: "blue",
        isBuiltIn: true,
        content: `# Meeting Notes

**Date:** ${new Date().toDateString()}
**Participants:** 
**Duration:** 

## Agenda
- 

## Discussion Points
- 

## Decisions Made
- 

## Action Items
- [ ] 
- [ ] 

## Next Meeting
**Date:** 
**Topics:** `
      },
      {
        id: "project-plan",
        title: "Project Planning",
        description: "Comprehensive project planning template with milestones and tasks",
        category: "project",
        icon: "🎯",
        color: "purple",
        isBuiltIn: true,
        content: `# Project Plan: [Project Name]

## Overview
**Start Date:** 
**End Date:** 
**Project Manager:** 
**Team Members:** 

## Objectives
- 

## Scope
### In Scope
- 

### Out of Scope
- 

## Milestones
| Milestone | Target Date | Status | Notes |
|-----------|-------------|---------|--------|
| Project Kickoff | | | |
| Phase 1 Complete | | | |
| Phase 2 Complete | | | |
| Project Delivery | | | |

## Tasks Breakdown
### Phase 1: Planning
- [ ] 
- [ ] 

### Phase 2: Development  
- [ ] 
- [ ] 

### Phase 3: Testing & Deployment
- [ ] 
- [ ] 

## Risks & Mitigation
- **Risk:** 
  - **Mitigation:** 

## Resources
- 

## Success Criteria
- `
      },
      {
        id: "research-paper",
        title: "Research Paper",
        description: "Academic research template with proper structure and citation formatting",
        category: "research",
        icon: "📚",
        color: "green",
        isBuiltIn: true,
        content: `# [Research Paper Title]

**Author:** 
**Date:** 
**Institution:** 

## Abstract
*Brief summary of the research (150-250 words)*


## 1. Introduction
### Background
### Problem Statement
### Research Questions
### Objectives

## 2. Literature Review
### Key Studies
### Research Gap
### Theoretical Framework

## 3. Methodology
### Research Design
### Data Collection
### Analysis Methods
### Limitations

## 4. Results
### Findings
### Data Analysis
### Statistical Results

## 5. Discussion
### Interpretation
### Implications
### Comparison with Previous Studies

## 6. Conclusion
### Summary
### Contributions
### Future Research

## References
1. 
2. 
3. 

## Appendices
### Appendix A: Data Tables
### Appendix B: Survey Questions`
      },
      {
        id: "code-documentation",
        title: "Code Documentation",
        description: "Technical documentation template for software projects",
        category: "technical",
        icon: "💻",
        color: "orange",
        isBuiltIn: true,
        content: `# [Project Name] Documentation

## Overview
Brief description of what this project does.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)

## Installation

\`\`\`bash
npm install project-name
\`\`\`

## Usage

### Basic Usage
\`\`\`javascript
import { ProjectName } from 'project-name';

const instance = new ProjectName();
instance.doSomething();
\`\`\`

## API Reference

### Class: ProjectName

#### Constructor
\`new ProjectName(options)\`

**Parameters:**
- \`options\` (Object) - Configuration options

#### Methods

##### \`doSomething()\`
Description of what this method does.

**Returns:** \`Promise<string>\`

**Example:**
\`\`\`javascript
await instance.doSomething();
\`\`\`

## Examples

### Example 1: Basic Setup
\`\`\`javascript
// Example code here
\`\`\`

### Example 2: Advanced Usage
\`\`\`javascript
// More complex example
\`\`\`

## Contributing
Guidelines for contributing to the project.

## License
MIT License`
      },
      {
        id: "daily-standup",
        title: "Daily Standup",
        description: "Quick daily standup template for team synchronization",
        category: "productivity",
        icon: "⚡",
        color: "yellow",
        isBuiltIn: true,
        content: `# Daily Standup - ${new Date().toDateString()}

**Team:** 
**Scrum Master:** 

## Attendees
- 
- 
- 

---

## [Team Member Name]
### Yesterday
- 

### Today  
- 

### Blockers
- 

---

## [Team Member Name]
### Yesterday
- 

### Today
- 

### Blockers
- 

---

## Action Items
- [ ] 
- [ ] 

## Notes
- `
      },
      {
        id: "product-spec",
        title: "Product Specification",
        description: "Detailed product specification template for feature development",
        category: "product",
        icon: "🚀",
        color: "indigo",
        isBuiltIn: true,
        content: `# Product Specification: [Feature Name]

## Overview
**Feature Owner:** 
**Engineering Lead:** 
**Designer:** 
**Target Release:** 

## Problem Statement
### Current State
### Desired State
### Impact of Not Solving

## Success Metrics
- **Primary Metric:** 
- **Secondary Metrics:** 

## User Stories
### As a [user type], I want [goal] so that [benefit]
- **Acceptance Criteria:**
  - [ ] 
  - [ ] 

## Technical Requirements
### Frontend Requirements
- 

### Backend Requirements
- 

### Database Changes
- 

### API Changes
- 

## Design Requirements
### User Flow
### Wireframes
### Design Assets

## Dependencies
### Internal Dependencies
- 

### External Dependencies
- 

## Implementation Plan
### Phase 1
- [ ] 
- [ ] 

### Phase 2  
- [ ] 
- [ ] 

## Risk Assessment
### Technical Risks
- **Risk:** 
  - **Mitigation:** 

### Business Risks
- **Risk:** 
  - **Mitigation:** 

## Testing Strategy
### Unit Tests
### Integration Tests
### User Acceptance Testing

## Launch Plan
### Beta Testing
### Rollout Strategy
### Monitoring & Analytics`
      }
    ];

    setTemplates(builtInTemplates);
  };

  const categories = [
    { value: "all", label: "All Templates", icon: Grid3X3, color: "gray" },
    { value: "productivity", label: "Productivity", icon: CheckSquare, color: "blue" },
    { value: "project", label: "Project Management", icon: Target, color: "purple" },
    { value: "research", label: "Research", icon: BookOpen, color: "green" },
    { value: "technical", label: "Technical", icon: Code, color: "orange" },
    { value: "product", label: "Product", icon: Briefcase, color: "indigo" },
    { value: "creative", label: "Creative", icon: Palette, color: "pink" }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template) => {
    try {
      const newPage = await Page.create({
        title: `${template.title} - ${new Date().toLocaleDateString()}`,
        icon: template.icon, // Pass the icon from the template
        content: template.content, // Pass the content from the template
        template: template.id, // Keep template ID for tracking
        is_public: false,
        collaborators: []
      });

      // Navigate to the new page
      window.location.href = createPageUrl(`Editor?pageId=${newPage.id}`);
    } catch (error) {
      console.error("Error creating page from template:", error);
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      // In a real app, you'd save custom templates to the database
      const customTemplate = {
        id: `custom-${Date.now()}`,
        ...templateData,
        isBuiltIn: false,
        // Default content for a new custom template
        content: `# ${templateData.title}\n\nYour template content goes here...` 
      };
      
      setTemplates(prev => [customTemplate, ...prev]);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get started quickly with pre-built templates
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-3xl clay-element clay-button font-semibold hover:scale-105 transition-transform duration-300"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-gray-200 dark:border-gray-600 clay-inner focus:border-purple-300 dark:focus:border-purple-500 focus:outline-none transition-colors duration-300 bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-3xl transition-all duration-300 whitespace-nowrap clay-button
                  ${selectedCategory === category.value
                    ? `bg-${category.color}-100 dark:bg-${category.color}-900/50 text-${category.color}-700 dark:text-${category.color}-300 clay-element`
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                <category.icon className="w-4 h-4" />
                <span className="font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Templates */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Featured Templates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.slice(0, 6).map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUseTemplate}
            />
          ))}
        </div>
      </div>

      {/* All Templates */}
      {filteredTemplates.length > 6 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">All Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.slice(6).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl clay-element p-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-700 clay-element flex items-center justify-center mx-auto mb-6">
              <Grid3X3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No templates found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Try adjusting your search terms or browse different categories
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-3xl clay-button font-semibold hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors duration-300"
            >
              <Grid3X3 className="w-5 h-5" />
              Show All Templates
            </button>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTemplate}
        />
      )}
    </div>
  );
}
