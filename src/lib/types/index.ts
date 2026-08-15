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
	metadata?: { kanbanCardId?: string };
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

export interface KanbanLabel {
	text: string;
	color: string;
}

export interface KanbanChecklistItem {
	id: string;
	text: string;
	done: boolean;
}

export interface KanbanCard {
	id: string;
	title: string;
	description?: string;
	labels?: KanbanLabel[];
	dueDate?: number;
	checklist?: KanbanChecklistItem[];
	sourceNodeId?: string | null;
}

export interface KanbanColumn {
	id: string;
	title: string;
	cards: KanbanCard[];
}

export interface KanbanBoard {
	id: string;
	title: string;
	sourceMapId: string | null;
	columns: KanbanColumn[];
	createdAt: number;
	updatedAt: number;
}

export type ViewMode = 'mindmap' | 'kanban';

export interface Workspace {
	version: 2;
	activeTabId: string;
	openTabs: string[];
	folders: Folder[];
	maps: MapData[];
	viewMode: ViewMode;
	activeBoardId: string;
	boards: KanbanBoard[];
}
