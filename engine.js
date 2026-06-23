class LinuxEngine {
    constructor() {
        // Structured virtual filesystem
        this.fs = {
            "/": {
                type: "dir",
                name: "root",
                content: ["home", "bin"],
                permissions: "drwxr-xr-x"
            },
            "/bin": {
                type: "dir",
                name: "bin",
                content: ["Terminal.app", "TextEditor.app"],
                permissions: "drwxr-xr-x"
            },
            "/bin/Terminal.app": {
                type: "app",
                name: "Terminal",
                icon: "terminal-icon.png",
                permissions: "-rwxr-xr-x"
            },
            "/bin/TextEditor.app": {
                type: "app",
                name: "Text Editor",
                icon: "editor-icon.png",
                permissions: "-rwxr-xr-x"
            },
            "/home": {
                type: "dir",
                name: "home",
                content: ["user"],
                permissions: "drwxr-xr-x"
            },
            "/home/user": {
                type: "dir",
                name: "user",
                content: ["Documents", "Pictures", "README.txt"],
                permissions: "drwxr-xr-x"
            },
            "/home/user/Documents": {
                type: "dir",
                name: "Documents",
                content: [],
                permissions: "drwxr-xr-x"
            },
            "/home/user/Pictures": {
                type: "dir",
                name: "Pictures",
                content: [],
                permissions: "drwxr-xr-x"
            },
            "/home/user/README.txt": {
                type: "file",
                name: "README.txt",
                content: "Welcome to your Web OS GUI!",
                permissions: "-rw-r--r--"
            }
        };
        
        this.currentDir = "/home/user";
    }

    // --- GUI Data API ---

    // Returns structural data for the current directory grid view
    getDirectoryContents(path = this.currentDir) {
        const dir = this.fs[path];
        if (!dir || dir.type !== "dir") return [];

        return dir.content.map(name => {
            const fullPath = path === "/" ? `/${name}` : `${path}/${name}`;
            const item = this.fs[fullPath];
            return {
                name: name,
                path: fullPath,
                type: item.type,
                icon: item.icon || (item.type === 'dir' ? 'folder-icon.png' : 'file-icon.png')
            };
        });
    }

    // Handles double-clicking an item in your GUI
    openItem(path) {
        const item = this.fs[path];
        if (!item) return { status: "error", message: "Item not found" };

        if (item.type === "dir") {
            this.currentDir = path;
            return { 
                status: "success", 
                action: "navigate", 
                data: this.getDirectoryContents(path) 
            };
        }

        if (item.type === "file") {
            return { 
                status: "success", 
                action: "open_editor", 
                name: item.name, 
                data: item.content 
            };
        }

        if (item.type === "app") {
            return { 
                status: "success", 
                action: "launch_app", 
                name: item.name 
            };
        }
    }

    // Creates a new item via GUI context menu or hotkeys
    createItem(name, type = "dir") {
        if (!name) return { status: "error", message: "Invalid name" };

        const newPath = this.currentDir === "/" ? `/${name}` : `${this.currentDir}/${name}`;
        if (this.fs[newPath]) return { status: "error", message: "Item already exists" };

        this.fs[this.currentDir].content.push(name);
        this.fs[newPath] = {
            type: type,
            name: name,
            content: type === "dir" ? [] : "",
            permissions: type === "dir" ? "drwxr-xr-x" : "-rw-r--r--"
        };

        return { status: "success", data: this.getDirectoryContents() };
    }

    // Deletes an item from the GUI view
    deleteItem(name) {
        const targetPath = this.currentDir === "/" ? `/${name}` : `${this.currentDir}/${name}`;
        if (!this.fs[targetPath]) return { status: "error", message: "Item not found" };

        // Remove from parent folder array
        this.fs[this.currentDir].content = this.fs[this.currentDir].content.filter(item => item !== name);
        
        // Remove object keys (simplified recursively for children if needed)
        delete this.fs[targetPath];

        return { status: "success", data: this.getDirectoryContents() };
    }
}

export default LinuxEngine;
