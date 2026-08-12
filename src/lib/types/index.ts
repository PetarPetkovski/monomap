export interface Vec2 {
	x: number;
	y: number;
}

export interface NodeStyle {
	color?: string;
	icon?: string;
}

export interface MindNode {
	id: string;
	text: string;
	position: Vec2;
	style?: NodeStyle;
	notes?: string;
	links?: string[];
	children: MindNode[];
}

export interface MapData {
	id: string;
	folderId: string | null;
	title: string;
	createdAt: number;
	updatedAt: number;
	rootNode: MindNode;
}

export interface Folder {
	id: string;
	name: string;
	createdAt: number;
}

export interface Workspace {
	version: 1;
	activeTabId: string;
	openTabs: string[];
	folders: Folder[];
	maps: MapData[];
}
