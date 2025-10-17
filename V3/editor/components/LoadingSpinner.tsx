'use client'

function LoadingSpinner() {
    return (
        <div role="status" className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="relative w-20 h-20">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>

                {/* Animated spinning gradient ring */}
                <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin-smooth"></div>

                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse-scale"></div>
                </div>

                {/* Orbital dots */}
                <div className="absolute inset-0 animate-spin-slow">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/60 rounded-full"></div>
                </div>
                <div className="absolute inset-0 animate-spin-slow" style={{ animationDelay: '0.5s' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/60 rounded-full"></div>
                </div>
            </div>

            {/* Loading text with animated dots */}
            <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-sm font-medium">Loading</span>
                <span className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                </span>
            </div>
        </div>
    )
}
export default LoadingSpinner;