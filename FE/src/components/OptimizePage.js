import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import OptimizeSection from "./OptimizeSection";
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService";
import OptimizeService from "../services/OptimizeService";
import axios from "axios";

const OptimizePage = () => {
  const navigate = useNavigate();
  const { code, language, reviewResult, setCode, setReviewResult } = useCode();
  const currentUser = AuthService.getCurrentUser();

  const handleBack = () => navigate("/editor");

  const handleNew = async () => {
    const shouldSave =
      code &&
      currentUser &&
      currentUser.username &&
      !reviewResult?.isFromHistory &&
      window.confirm("Do you want to save this optimization result to history?");

    if (shouldSave) {
      try {
        let userId = currentUser.id;
        
        if (!userId) {
          try {
            const response = await axios.get(
              `http://localhost:8000/api/user/${currentUser.username}`,
              { timeout: 5000 }
            );
            userId = response.data.id;
            const updatedUser = { ...currentUser, id: userId };
            AuthService.setCurrentUser(updatedUser);
          } catch (err) {
            console.error("Cannot get userId:", err);
            alert("Cannot get user info. Please login again.");
            AuthService.logout();
            navigate("/");
            return;
          }
        }

        // Call OptimizeService to get optimizations
        let optimizationText = "";
        try {
          console.log("Calling OptimizeService to save...");
          const optimizeResult = await OptimizeService.optimizeCode(
            language,
            code,
            currentUser.username
          );
          
          // Get optimizations from response
          optimizationText = optimizeResult.optimizations || 
                            optimizeResult.explanation || 
                            optimizeResult.feedback || 
                            "No optimizations generated.";
                          
          console.log("Got optimizations:", optimizationText.substring(0, 100) + "...");
        } catch (err) {
          console.error("Error calling OptimizeService:", err);
          optimizationText = `Error getting optimizations: ${err.message}`;
        }

        // Payload to save to database
        const payload = {
          userId,
          username: currentUser.username,
          originalCode: code || "",
          reviewSummary: optimizationText, // Save optimizations to reviewSummary
          fixedCode: null, // Optimization suggestions don't have fixed code
          language: language || "unknown",
        };

        console.log("Payload to save:", {
          ...payload,
          reviewSummary: payload.reviewSummary.substring(0, 100) + "..." // log briefly
        });

        const result = await SaveService.saveReview(payload);
        console.log("History saved successfully!", result);

        // Dispatch event to update history
        window.dispatchEvent(
          new CustomEvent("historyUpdated", {
            detail: {
              newHistoryId: result.historyId,
              username: currentUser.username,
            },
          })
        );

        localStorage.setItem("history_needs_refresh", "true");
        localStorage.setItem("last_save_time", Date.now().toString());

        alert("Optimization result saved to history!");
      } catch (err) {
        console.error("Error saving history:", err);
        
        let errorMessage = "Cannot save history.";
        if (err.response) {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`;
        } else if (err.message) {
          errorMessage = `Error: ${err.message}`;
        }
        
        alert(`${errorMessage}\n\nPlease try again later.`);
      }
    }

    // Reset and navigate back to editor
    setCode("");
    setReviewResult(null);
    navigate("/editor", { replace: true });
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-200"> {/* Red theme for optimization */}
      <header className="bg-transparent shadow-none border-none">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-700 via-pink-700 to-rose-600 drop-shadow-md tracking-wide"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            DEVREVIEW
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-800">
              Hello, <span className="font-semibold">{currentUser?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-colors bg-transparent"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <OptimizeSection
        code={code}
        language={language}
        reviewResult={reviewResult}
        currentUser={currentUser}
        onBack={handleBack}
        onNew={handleNew}
      />
    </div>
  );
};

export default OptimizePage;