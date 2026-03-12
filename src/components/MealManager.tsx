import React, { useState, useEffect } from 'react';
import { Camera, Plus, Check, X } from 'lucide-react';

export function MealManager() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMeal, setScannedMeal] = useState<any>(null);
  const [genAI, setGenAI] = useState<any>(null);

  useEffect(() => {
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
    import('@google/genai').then(({ GoogleGenAI }) => {
      setGenAI(new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
    });
  }, []);

  const handleManualAdd = () => {
    // Add logic to save meal to backend
    console.log('Adding meal:', { name, price, ingredients });
    setName('');
    setPrice('');
    setIngredients('');
  };

  const handleScanMenu = async () => {
    if (!genAI) return;
    setIsScanning(true);
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Scan this menu and return the meals in JSON format.',
      });
      console.log(response.text);
      // Process response.text and setScannedMeal
      setScannedMeal({ name: 'Scanned Pizza', price: 12.99, ingredients: 'Dough, Tomato, Cheese' });
    } catch (error) {
      console.error('Error scanning menu:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold mb-4">Add Meal</h3>
      
      <div className="space-y-4">
        <input type="text" placeholder="Meal Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
        <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
        <textarea placeholder="Ingredients" value={ingredients} onChange={e => setIngredients(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
        <button onClick={handleManualAdd} className="w-full bg-primary text-white py-2 rounded-lg font-bold">Add Manually</button>
      </div>

      <div className="mt-6 border-t pt-6">
        <button onClick={handleScanMenu} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold">
          <Camera size={20} />
          {isScanning ? 'Scanning...' : 'Scan Menu with AI'}
        </button>
      </div>

      {scannedMeal && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-bold">Scanned: {scannedMeal.name}</p>
          <p>Price: ${scannedMeal.price}</p>
          <p>Ingredients: {scannedMeal.ingredients}</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setScannedMeal(null)} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1"><Check size={16} /> Accept</button>
            <button onClick={() => setScannedMeal(null)} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1"><X size={16} /> Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}
