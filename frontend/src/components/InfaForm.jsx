import { useState } from "react";

const InfraForm = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("deepseek");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onGenerate(prompt, model);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectModel = (selectedModel) => {
    if (!isSubmitting) {
      setModel(selectedModel);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Generate Cloud Infrastructure</h2>
      <form onSubmit={handleSubmit} className="infra-form">
        <div className="form-group">
          <label htmlFor="prompt">
            <span className="label-icon">📝</span>
            Describe Your Infrastructure
          </label>
          <textarea
            id="prompt"
            className="infra-input"
            placeholder="Example: Create a scalable web application with a load balancer, auto-scaling group, and RDS database..."
            value={prompt}
            onChange={handlePromptChange}
            required
            disabled={isSubmitting}
          />
          <div className="input-footer">
            <div className="textarea-info">
              Be as specific as possible with your requirements
            </div>
            <div className="char-count">{charCount} characters</div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="model">
            <span className="label-icon">🤖</span>
            Select AI Model
          </label>
          <div className="select-wrapper">
            <select
              id="model"
              className="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="deepseek">DeepSeek AI</option>
              <option value="gemini">Gemini AI</option>
            </select>
            <div className="select-arrow">▼</div>
          </div>
          <div className="model-info">
            <div 
              className={`model-badge ${model === 'deepseek' ? 'active' : ''}`}
              onClick={() => selectModel('deepseek')}
            >
              <span className="model-icon">🧠</span>
              <div className="model-details">
                <span className="model-name">DeepSeek AI</span>
                <span className="model-description">Optimized for complex infrastructure with advanced capabilities</span>
              </div>
            </div>
            <div 
              className={`model-badge ${model === 'gemini' ? 'active' : ''}`}
              onClick={() => selectModel('gemini')}
            >
              <span className="model-icon">💫</span>
              <div className="model-details">
                <span className="model-name">Gemini AI</span>
                <span className="model-description">Balanced for general use cases with great performance</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting || prompt.trim().length < 10}
        >
          {isSubmitting ? (
            <>
              <span className="button-spinner"></span>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span className="button-icon">⚡</span>
              <span>Generate Infrastructure</span>
            </>
          )}
        </button>
        
        {prompt.trim().length < 10 && prompt.trim().length > 0 && (
          <div className="form-hint">
            Please provide a more detailed description (at least 10 characters)
          </div>
        )}
      </form>
    </div>
  );
};

export default InfraForm;