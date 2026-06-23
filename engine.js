class WebOSEngine {
    constructor() {
        // Core Microkernel State
        this.processes = new Map(); // Tracks running applications/processes
        this.windows = [];          // Ordered array tracking window stacking (Z-Index)
        this.processIdCounter = 1;
        this.windowIdCounter = 1;

        // Virtualized Root Filesystem
        this.fs = {
            "/": { type: "dir", name: "root", children: ["system", "users"] },
            "/system": { type: "dir", name: "system", children: ["apps"] },
            "/system/apps": { type: "dir", name: "apps", children: ["Settings", "Browser", "Files"] },
            "/users": { type: "dir", name: "users", children: ["guest"] },
            "/users/guest": { type: "dir", name: "guest", children: ["Desktop"] },
            "/users/guest/Desktop": { type: "dir", name: "Desktop", children: [] }
        };

        // Configuration Settings
        this.registry = {
            theme: "dark",
            wallpaper: "default.jpg",
            language: "en"
        };
    }

    // ==========================================
    // 1. PROCESS & INTER-PROCESS LIFE-CYCLE (IPC)
    // ==========================================
    
    launchProcess(appName, envArgs = {}) {
        const pid = this.processIdCounter++;
        const processStructure = {
            pid: pid,
            name: appName,
            status: "running",
            memoryAllocation: {}, 
            args: envArgs,
            launchedAt: Date.now()
        };
        
        this.processes.set(pid, processStructure);
        
        // Auto-allocate a window viewport for UI apps
        const win = this.createWindow(pid, appName);
        return { pid, windowId: win.id };
    }

    killProcess(pid) {
        if (!this.processes.has(pid)) return false;
        
        this.processes.delete(pid);
        // Clean up any open windows tied to this process
        this.windows = this.windows.filter(win => win.pid !== pid);
        return true;
    }

    // ==========================================
    // 2. WINDOW MANAGER & LAYER PIPELINE (Z-INDEX)
    // ==========================================

    createWindow(pid, title) {
        const winId = this.windowIdCounter++;
        const newWindow = {
            id: winId,
            pid: pid,
            title: title,
            dimensions: { x: 100, y: 100, width: 640, height: 480 },
            isMaximized: false,
            isMinimized: false
        };

        this.windows.push(newWindow);
        this.focusWindow(winId); // Automatically bring new windows to the front
        return newWindow;
    }

    focusWindow(winId) {
        const index = this.windows.findIndex(w => w.id === winId);
        if (index === -1) return;

        // Pull out of current position and push to the end (top of stack)
        const targetWindow = this.windows.splice(index, 1)[0];
        this.windows.push(targetWindow);
    }

    updateWindowGeometry(winId, updates) {
        const win = this.windows.find(w => w.id === winId);
        if (!win) return false;

        if (updates.dimensions) win.dimensions = { ...win.dimensions, ...updates.dimensions };
        if (updates.isMaximized !== undefined) win.isMaximized = updates.isMaximized;
        if (updates.isMinimized !== undefined) win.isMinimized = updates.isMinimized;
        
        return true;
    }

    // Returns structural mapping of windows with resolved absolute CSS z-indexes
    getRenderTree() {
        return this.windows.map((win, index) => ({
            ...win,
            zIndex: 100 + index // Dynamically maps array index directly into DOM Z-Index layers
        }));
    }

    // ==========================================
    // 3. STORAGE & SYSTEM BUS
    // ==========================================

    saveSystemState() {
        const payload = {
            fs: this.fs,
            registry: this.registry
        };
        localStorage.setItem("web_os_state", JSON.stringify(payload));
    }

    loadSystemState() {
        const saved = localStorage.getItem("web_os_state");
        if (!saved) return false;
        
        const data = JSON.parse(saved);
        this.fs = data.fs;
        this.registry = data.registry;
        return true;
    }
}

export default WebOSEngine;
