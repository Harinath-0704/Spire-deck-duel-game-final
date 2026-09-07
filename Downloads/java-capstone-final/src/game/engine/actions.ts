
export type BaseAction = {
  actionId?: string;
  isRemote?: boolean;
};

export type GameAction = BaseAction & (
  | { type: 'SYNC_STATE'; state: any }
  | { type: 'START_BATTLE'; isHost?: boolean }
  | { type: 'PLAY_CARD'; playerId: 'player' | 'opponent'; cardIndex: number }
  | { type: 'END_TURN'; playerId: 'player' | 'opponent' }
  | { type: 'TICK' } // Timer tick
  | { type: 'TIMEOUT'; playerId: 'player' | 'opponent' }
  | { type: 'SURRENDER'; playerId: 'player' | 'opponent' }
  | { type: 'SET_CHARACTER'; playerId: 'player' | 'opponent'; characterId: string; imageUrl: string; playerName?: string }
);
