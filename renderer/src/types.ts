export interface Game {
  id: string; // Steamゲームの場合はAppID, 手動の場合はUUIDなど
  type: 'steam' | 'manual';
  title: string;
  coverArt: string; // URLまたはローカルファイルのパス
  backgroundVideo: string | null; // (任意) ビデオのURLまたはローカルファイルのパス
  isPathValid?: boolean; // For manual games, to check if the executable exists
}
