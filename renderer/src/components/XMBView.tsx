import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Game } from '../types';
import Carousel from './Carousel';

interface XMBViewProps {
  games: Game[];
  onGameClick: (game: Game) => void;
  onGameSelect: (game: Game | null) => void;
  onContextMenu: (e: React.MouseEvent, game: Game) => void;
}

const categories = ['All', 'Steam', 'Manual'];

const XMBView: React.FC<XMBViewProps> = ({ games, onGameClick, onGameSelect, onContextMenu }) => {
  const [focus, setFocus] = useState<'categories' | 'carousel'>('categories');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [activeGameIndex, setActiveGameIndex] = useState(0);

  const filteredGames = useMemo(() => {
    const category = categories[selectedCategoryIndex];
    if (category === 'All') {
      return games;
    }
    return games.filter(game => game.type === category.toLowerCase());
  }, [games, selectedCategoryIndex]);
  
  useEffect(() => {
    setActiveGameIndex(0);
  }, [selectedCategoryIndex]);

  useEffect(() => {
    if (filteredGames.length > 0) {
      onGameSelect(filteredGames[activeGameIndex]);
    } else {
      onGameSelect(null);
    }
  }, [activeGameIndex, filteredGames, onGameSelect]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) {
      return; // Don't interfere with typing in input fields
    }
    e.preventDefault();
    if (focus === 'categories') {
      switch (e.key) {
        case 'ArrowLeft': case 'a':
          setSelectedCategoryIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'ArrowRight': case 'd':
          setSelectedCategoryIndex((prev) => (prev < categories.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowDown': case 's':
          if (filteredGames.length > 0) setFocus('carousel');
          break;
      }
    } else if (focus === 'carousel') {
      switch (e.key) {
        case 'ArrowUp': case 'w':
          setFocus('categories');
          break;
        case 'ArrowLeft': case 'a':
          setActiveGameIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'ArrowRight': case 'd':
          setActiveGameIndex((prev) => (prev < filteredGames.length - 1 ? prev + 1 : prev));
          break;
        case 'Enter':
          if (filteredGames[activeGameIndex]) onGameClick(filteredGames[activeGameIndex]);
          break;
      }
    }
  }, [focus, filteredGames, activeGameIndex, onGameClick]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (focus === 'carousel') {
      e.preventDefault();
      if (e.deltaY < 0) {
        setActiveGameIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.deltaY > 0) {
        setActiveGameIndex((prev) => (prev < filteredGames.length - 1 ? prev + 1 : prev));
      }
    }
  }, [focus, filteredGames.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleKeyDown, handleWheel]);

  return (
    <div className="flex flex-col h-full text-text-main pt-16 overflow-hidden">
      <div className="flex items-center justify-center space-x-8 flex-shrink-0">
        {categories.map((category, index) => (
          <div key={category} className="flex flex-col items-center p-2 rounded-lg"
            style={{ border: focus === 'categories' && selectedCategoryIndex === index ? '2px solid var(--color-accent)' : '2px solid transparent' }}
          >
            <h3
              className={`text-2xl transition-all duration-200 cursor-pointer ${
                selectedCategoryIndex === index ? 'font-bold text-accent scale-125' : 'text-text-dim'
              }`}
              onClick={() => setSelectedCategoryIndex(index)}
            >
              {category}
            </h3>
          </div>
        ))}
      </div>

      <div className="flex-grow mt-8 flex justify-center items-center">
        <Carousel 
          games={filteredGames} 
          onGameClick={onGameClick} 
          onGameSelect={onGameSelect} 
          activeIndex={activeGameIndex}
          setActiveIndex={setActiveGameIndex}
          onContextMenu={onContextMenu}
        />
      </div>
    </div>
  );
};

export default XMBView;