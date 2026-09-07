export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string
          avatar: string | null
          created_at: string
          updated_at: string
          coins: number
          streak: number
          last_daily_claim: string | null
          equipped_character_id: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name: string
          avatar?: string | null
          created_at?: string
          updated_at?: string
          coins?: number
          streak?: number
          last_daily_claim?: string | null
          equipped_character_id?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string
          avatar?: string | null
          created_at?: string
          updated_at?: string
          coins?: number
          streak?: number
          last_daily_claim?: string | null
          equipped_character_id?: string
        }
        Relationships: any[]
      }
      rooms: {
        Row: {
          id: string
          room_code: string
          host_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_code: string
          host_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          host_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      room_players: {
        Row: {
          id: string
          room_id: string
          player_id: string
          player_index: number
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          player_index: number
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          player_index?: number
          joined_at?: string
        }
        Relationships: any[]
      }
      matches: {
        Row: {
          id: string
          room_id: string | null
          player_one_id: string | null
          player_two_id: string | null
          winner_id: string | null
          status: string
          created_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          player_one_id?: string | null
          player_two_id?: string | null
          winner_id?: string | null
          status?: string
          created_at?: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          player_one_id?: string | null
          player_two_id?: string | null
          winner_id?: string | null
          status?: string
          created_at?: string
          finished_at?: string | null
        }
        Relationships: any[]
      }
      player_cards: {
        Row: {
          id: string
          player_id: string
          card_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          player_id: string
          card_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          card_id?: string
          unlocked_at?: string
        }
        Relationships: any[]
      }
      player_characters: {
        Row: {
          id: string
          player_id: string
          character_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          player_id: string
          character_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          character_id?: string
          unlocked_at?: string
        }
        Relationships: any[]
      }
      player_skins: {
        Row: {
          id: string
          player_id: string
          skin_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          player_id: string
          skin_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          skin_id?: string
          unlocked_at?: string
        }
        Relationships: any[]
      }
      daily_rewards: {
        Row: {
          id: string
          player_id: string
          reward_date: string
          day_number: number
          coins_awarded: number
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          reward_date: string
          day_number: number
          coins_awarded: number
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          reward_date?: string
          day_number?: number
          coins_awarded?: number
          created_at?: string
        }
        Relationships: any[]
      }
      player_decks: {
        Row: {
          id: string
          player_id: string
          card_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          card_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          card_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_decks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
