import { useState, useMemo } from 'react';
import { Shuffle, BookOpen, Heart, House, Cake, Star, TreeStructure, MapTrifold } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface StoryPromptsProps {
  onSelect: (prompt: string) => void;
  className?: string;
}

const CATEGORIES = [
  { id: 'childhood', label: 'Childhood', icon: Cake, color: 'text-terracotta-500 bg-terracotta-50' },
  { id: 'family', label: 'Family', icon: TreeStructure, color: 'text-sage-500 bg-sage-50' },
  { id: 'traditions', label: 'Traditions', icon: Star, color: 'text-gold-500 bg-gold-50' },
  { id: 'home', label: 'Home', icon: House, color: 'text-walnut-500 bg-cream-200' },
  { id: 'love', label: 'Love', icon: Heart, color: 'text-terracotta-600 bg-terracotta-50' },
  { id: 'adventures', label: 'Adventures', icon: MapTrifold, color: 'text-sage-400 bg-sage-50' },
] as const;

const PROMPTS: Record<string, string[]> = {
  childhood: [
    'What was your favorite game to play as a child?',
    'Describe the house you grew up in. What made it special?',
    'What was your most treasured childhood toy or possession?',
    'Tell the story of your best childhood friend.',
    'What did you want to be when you grew up?',
    'What was your favorite meal that your parents or grandparents made?',
    'Describe a typical summer day from your childhood.',
    'What was the funniest thing that happened to you as a kid?',
    'What was school like for you? Did you have a favorite teacher?',
    'What music or songs remind you of your childhood?',
  ],
  family: [
    'What is the most important lesson a family member taught you?',
    'Describe a time your family came together during a difficult moment.',
    'Who in your family do you take after the most and why?',
    'What do you know about your grandparents\' lives before you were born?',
    'What family saying or phrase do you still use today?',
    'Tell the story of how your parents or grandparents met.',
    'What is the oldest family photo you have? Describe what\'s in it.',
    'What family trait or talent has been passed down through generations?',
    'Describe a family reunion or gathering that stands out in your memory.',
    'What story has been told so many times it\'s become family legend?',
  ],
  traditions: [
    'What holiday tradition means the most to your family?',
    'Describe your family\'s most unique tradition.',
    'What recipe has been passed down in your family?',
    'How did your family celebrate birthdays?',
    'What tradition from your childhood do you still practice?',
    'Describe the best holiday celebration you can remember.',
    'What new tradition has your family started in recent years?',
    'How did your family mark the changing of seasons?',
    'What cultural or religious traditions shaped your upbringing?',
    'What tradition do you wish your family had started sooner?',
  ],
  home: [
    'Describe the neighborhood you grew up in.',
    'What room in your childhood home holds the most memories?',
    'Tell the story of your first home as an adult.',
    'What sounds and smells do you associate with home?',
    'Describe your family\'s kitchen and what happened there.',
    'What did your front porch or yard look like?',
    'Tell the story of a time your home was full of people.',
    'What was your favorite hiding spot as a child?',
    'Describe the view from your childhood bedroom window.',
    'What object in your home has a special story behind it?',
  ],
  love: [
    'Tell the story of how you met your partner.',
    'What was your first date like?',
    'Describe the moment you knew you were in love.',
    'What is the most romantic thing someone has done for you?',
    'Tell the story of your wedding day or a special commitment.',
    'What has surprised you most about long-term love?',
    'Describe a time you and your partner overcame something together.',
    'What small gesture from your partner means the most to you?',
    'What advice would you give about finding and keeping love?',
    'What song reminds you of someone you love?',
  ],
  adventures: [
    'What was the most memorable trip your family took together?',
    'Describe a time you were completely out of your comfort zone.',
    'Tell the story of your greatest adventure.',
    'What place have you visited that changed your perspective?',
    'Describe the best road trip you\'ve ever taken.',
    'What is the bravest thing you\'ve ever done?',
    'Tell the story of a time things went hilariously wrong on a trip.',
    'What place do you dream of visiting and why?',
    'Describe a spontaneous adventure that became a great memory.',
    'What is the most beautiful place you\'ve ever seen?',
  ],
};

export function StoryPrompts({ onSelect, className }: StoryPromptsProps) {
  const [category, setCategory] = useState<string>('childhood');
  const [expanded, setExpanded] = useState(false);

  const randomPrompt = useMemo(() => {
    const allPrompts = Object.values(PROMPTS).flat();
    return allPrompts[Math.floor(Math.random() * allPrompts.length)];
  }, []);

  const [featured, setFeatured] = useState(randomPrompt);

  function shuffle() {
    const allPrompts = Object.values(PROMPTS).flat();
    let next = featured;
    while (next === featured) {
      next = allPrompts[Math.floor(Math.random() * allPrompts.length)];
    }
    setFeatured(next);
  }

  const prompts = PROMPTS[category] ?? [];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Featured prompt card */}
      <div className="bg-gradient-to-br from-terracotta-50 via-cream-50 to-gold-50 rounded-xl border border-terracotta-100 p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen size={16} weight="fill" className="text-terracotta-500" />
            <span className="text-xs font-semibold text-walnut-700 font-body">Story Prompt</span>
          </div>
          <button
            onClick={shuffle}
            className="p-1.5 rounded-lg text-walnut-400 hover:text-terracotta-500 hover:bg-white/60 transition-colors"
            title="Get another prompt"
          >
            <Shuffle size={14} />
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.button
            key={featured}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onClick={() => onSelect(featured)}
            className="text-left w-full"
          >
            <p className="text-sm text-walnut-700 leading-relaxed font-body italic">"{featured}"</p>
            <p className="text-[10px] text-terracotta-400 mt-2 font-body font-medium">Tap to use this prompt</p>
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-walnut-400 hover:text-walnut-600 transition-colors font-body font-medium"
      >
        {expanded ? 'Hide prompt library' : 'Browse 60+ story prompts...'}
      </button>

      {/* Full library */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-sand-200 p-4 space-y-4 shadow-card">
              {/* Category pills */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-colors border',
                      category === cat.id
                        ? 'bg-terracotta-50 text-terracotta-600 border-terracotta-200'
                        : 'bg-cream-100 text-walnut-500 border-sand-200 hover:border-sand-300'
                    )}
                  >
                    <cat.icon size={13} weight={category === cat.id ? 'fill' : 'regular'} />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Prompt list */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {prompts.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      onSelect(prompt);
                      setExpanded(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-walnut-600 hover:bg-cream-100 hover:text-walnut-800 transition-colors font-body leading-relaxed"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
