import React from 'react';
import { Game } from '../types';

interface CarouselProps {
  games: Game[];
  onGameClick: (game: Game) => void;
  onGameSelect: (game: Game | null) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onContextMenu: (game: Game) => void;
}

const Carousel: React.FC<CarouselProps> = ({ games, onGameClick, onGameSelect, activeIndex, setActiveIndex, onContextMenu }) => {
  if (games.length === 0) {
    return <div className="text-center text-text-dim mt-20">No games in this category.</div>;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ perspective: '1000px' }}>
      <div className="relative w-full h-80 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        {games.map((game, index) => {
          const offset = index - activeIndex;
          const isVisible = Math.abs(offset) < 3; // Only render a few items for performance

          if (!isVisible) return null;

          const style: React.CSSProperties = {
            transform: `
              translateX(${(offset * 200)}px) 
              scale(${1 - Math.abs(offset) * 0.2})
              rotateY(${offset * -35}deg)
            `,
            zIndex: games.length - Math.abs(offset),
            opacity: 1 - Math.abs(offset) * 0.3,
            transition: 'transform 0.5s ease, opacity 0.5s ease',
            position: 'absolute',
          };

          return (
            <div
              key={game.id}
              className={`w-48 h-72 cursor-pointer relative ${offset === 0 ? 'border-4 border-accent shadow-accent/50 shadow-2xl' : ''}`}
              style={style}
              onClick={() => {
                if (game.isPathValid === false) return; // Don't launch invalid games
                if (offset === 0) {
                  onGameClick(game);
                } else {
                  setActiveIndex(index);
                }
              }}
              onContextMenu={(e) => onContextMenu(e, game)}
              onMouseEnter={() => onGameSelect(game)}
              onMouseLeave={() => onGameSelect(games[activeIndex])}
            >
              <img
                src={game.coverArt || `https://via.placeholder.com/200x300?text=${encodeURIComponent(game.title)}`}
                alt={game.title}
                className="w-full h-full object-cover rounded-lg"
              />
              {offset === 0 && (
                <div className="absolute inset-0 flex items-end justify-center pb-2 bg-gradient-to-t from-black via-transparent to-transparent">
                  <span className="text-text-main text-lg font-bold truncate px-2">{game.title}</span>
                </div>
              )}
              {game.isPathValid === false && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-center p-2 rounded-lg">
                    <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-xs text-yellow-300 mt-2">パスが無効です</p>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Carousel;
