export const DND_TYPES = {
  TEAM: 'TEAM',
} as const

export type TeamDragItem = {
  type: typeof DND_TYPES.TEAM
  teamId: string
}

export const DND_TEAM = "TEAM";

export const DND_PLACED_OPTION = "MM_PLACED_OPTION";

export const DND_OPTION = "OPTION";

export type DragOptionItem = {
  type: typeof DND_OPTION;
  optionId: string;
  fromTileId?: string;
};

export type DragPlacedOptionItem = {
  type: typeof DND_PLACED_OPTION;
  optionId: string;
  fromTileId: string;
};
