import React, { useState } from "react";
import axios from "axios";
import BASE_URL from "../../assets/assests";

const Result = () => {
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCustomSubmit = async () => {
    if (!customFrom || !customTo) {
      alert("Please select both dates.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/results/custom`, {
        from: customFrom,
        to: customTo,
      });
      setMessage(res.data.message || "Custom results sent successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send custom results.");
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklySubmit = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/results/weekly`);
      setMessage(res.data.message || "Weekly results sent successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send weekly results.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlySubmit = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/results/monthly`);
      setMessage(res.data.message || "Monthly results sent successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send monthly results.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-6">Generate & Mail Results</h1>

      {/* Custom Range */}
      <div className="bg-white shadow-md p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Custom Range</h2>
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block mb-1">From:</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">To:</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
        </div>
        <button
          onClick={handleCustomSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
        >
          Send Custom Range Results
        </button>
      </div>

      {/* Weekly Result */}
      <div className="bg-white shadow-md p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Weekly Result</h2>
        <button
          onClick={handleWeeklySubmit}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
        >
          Send Weekly Results
        </button>
      </div>

      {/* Monthly Result */}
      <div className="bg-white shadow-md p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Monthly Result</h2>
        <button
          onClick={handleMonthlySubmit}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded"
        >
          Send Monthly Results
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center mt-4 text-lg font-medium text-gray-800">
          {loading ? "Processing..." : message}
        </div>
      )}
    </div>
  );
};

export default Result;
