import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { X, ChevronRight, Check } from 'lucide-react';

export function Tutorial() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (user) {
      const hasSeen = localStorage.getItem(`tutorial_${user.role}`);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }
  }, [user]);

  const closeTutorial = () => {
    if (user) {
      localStorage.setItem(`tutorial_${user.role}`, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  const tutorials = {
    owner: [
      { title: "Welcome to Comanda", desc: "As an owner, you have total data transparency." },
      { title: "Revenue & Filters", desc: "Use the time filters at the top to view historical data." },
      { title: "Master Log", desc: "Click on any order in the Master Log to see exact timestamps." }
    ],
    server: [
      { title: "Fast-Paced Ordering", desc: "Select a table, add items, and hit Send to split the order instantly." },
      { title: "Special Notes", desc: "Add notes like 'No Salt' directly to items before sending." },
      { title: "Delivery Confirmation", desc: "When an order is ready, you'll be notified. Tap 'Delivered' to close it." }
    ],
    kitchen: [
      { title: "Kitchen Queue", desc: "This is your digital chit board. Only food items appear here." },
      { title: "Mark as Ready", desc: "Tap 'Mark Ready' when an item is done to notify the server." },
      { title: "Timers", desc: "Tickets turn yellow after 10 mins, and red after 20 mins." }
    ],
    bar: [
      { title: "Bar Queue", desc: "This is your digital chit board. Only drink items appear here." },
      { title: "Mark as Ready", desc: "Tap 'Mark Ready' when an item is done to notify the server." },
      { title: "Timers", desc: "Tickets turn yellow after 10 mins, and red after 20 mins." }
    ]
  };

  const steps = tutorials[user.role];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-emerald-400">Prima Volta Tutorial</h2>
              <button onClick={closeTutorial} className="text-zinc-500 hover:text-zinc-300">
                <X size={20} />
              </button>
            </div>

            <div className="min-h-[120px]">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-bold mb-2">{steps[step].title}</h3>
                <p className="text-zinc-400">{steps[step].desc}</p>
              </motion.div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-800">
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full ${i === step ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => {
                  if (step < steps.length - 1) setStep(step + 1);
                  else closeTutorial();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
              >
                {step < steps.length - 1 ? (
                  <>Next <ChevronRight size={16} /></>
                ) : (
                  <>Get Started <Check size={16} /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
