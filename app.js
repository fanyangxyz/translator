class TranslationEvaluator {
    constructor() {
        this.sourceText = document.getElementById('source-text');
        this.translatedText = document.getElementById('translated-text');
        this.sourceLang = document.getElementById('source-lang');
        this.targetLang = document.getElementById('target-lang');
        this.evaluateBtn = document.getElementById('evaluate-btn');
        this.swapBtn = document.getElementById('swap-languages');
        this.clearSourceBtn = document.getElementById('clear-source');
        this.clearTranslationBtn = document.getElementById('clear-translation');
        this.sourceCharCount = document.getElementById('source-char-count');
        this.translationCharCount = document.getElementById('translation-char-count');
        this.loading = document.getElementById('loading');
        this.evaluationSection = document.getElementById('evaluation-section');
        this.qualityScore = document.getElementById('quality-score');
        this.evaluationMetrics = document.getElementById('evaluation-metrics');
        this.aiFeedback = document.getElementById('ai-feedback');

        // Conversation elements
        this.conversationHistory = document.getElementById('conversation-history');
        this.conversationMessage = document.getElementById('conversation-message');
        this.sendMessageBtn = document.getElementById('send-message');

        // Store conversation context
        this.currentOriginalText = '';
        this.currentTranslation = '';
        this.currentEvaluation = null;

        // New elements for API and prompt management
        this.apiKeyInput = document.getElementById('api-key');
        this.toggleApiKeyBtn = document.getElementById('toggle-api-key');
        this.evaluationPromptTextarea = document.getElementById('evaluation-prompt');
        this.resetPromptBtn = document.getElementById('reset-prompt');

        this.defaultPrompt = this.getDefaultPrompt();

        this.initializeAuth();
        this.initializeEventListeners();
        this.updateCharCounts();
        this.initializePrompt();
    }

    initializeEventListeners() {
        this.sourceText.addEventListener('input', () => {
            this.updateCharCounts();
            this.hideEvaluation();
        });

        this.translatedText.addEventListener('input', () => {
            this.updateCharCounts();
            this.hideEvaluation();
        });

        this.evaluateBtn.addEventListener('click', () => {
            this.evaluateTranslation();
        });

        this.swapBtn.addEventListener('click', () => {
            this.swapLanguages();
        });

        this.clearSourceBtn.addEventListener('click', () => {
            this.clearSource();
        });

        this.clearTranslationBtn.addEventListener('click', () => {
            this.clearTranslation();
        });

        // Add load example button event listener
        const loadExampleBtn = document.getElementById('load-example');
        loadExampleBtn.addEventListener('click', () => {
            this.loadExample();
        });

        // Conversation event listeners
        this.sendMessageBtn.addEventListener('click', () => {
            this.sendConversationMessage();
        });

        this.conversationMessage.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.sendConversationMessage();
            }
        });

        this.sourceText.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.evaluateTranslation();
            }
        });

        this.translatedText.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.evaluateTranslation();
            }
        });

        // API key toggle event listener
        this.toggleApiKeyBtn.addEventListener('click', () => {
            this.toggleApiKeyVisibility();
        });

        this.resetPromptBtn.addEventListener('click', () => {
            this.resetPrompt();
        });
    }

    updateCharCounts() {
        const sourceCount = this.sourceText.value.length;
        const translationCount = this.translatedText.value.length;
        this.sourceCharCount.textContent = `${sourceCount} character${sourceCount !== 1 ? 's' : ''}`;
        this.translationCharCount.textContent = `${translationCount} character${translationCount !== 1 ? 's' : ''}`;
    }

    swapLanguages() {

        const sourceValue = this.sourceLang.value;
        const targetValue = this.targetLang.value;
        const sourceTextValue = this.sourceText.value;
        const translatedTextValue = this.translatedText.value;

        this.sourceLang.value = targetValue;
        this.targetLang.value = sourceValue;
        this.sourceText.value = translatedTextValue;
        this.translatedText.value = sourceTextValue;

        this.updateCharCounts();
        this.hideEvaluation();
    }

    clearSource() {
        this.sourceText.value = '';
        this.updateCharCounts();
        this.hideEvaluation();
    }

    clearTranslation() {
        this.translatedText.value = '';
        this.updateCharCounts();
        this.hideEvaluation();
    }

    loadExample() {
        const exampleText = `"YES, of course, if it's fine tomorrow," said Mrs. Ramsay. "But you'll have to be up with the lark," she added.`;
        this.sourceText.value = exampleText;
        this.updateCharCounts();
        this.hideEvaluation();
    }

    hideEvaluation() {
        this.evaluationSection.classList.add('hidden');
    }

    showEvaluation() {
        this.evaluationSection.classList.remove('hidden');
    }

    async evaluateTranslation() {
        const originalText = this.sourceText.value.trim();
        const userTranslation = this.translatedText.value.trim();

        if (!originalText) {
            alert('Please enter the original text');
            return;
        }

        if (!userTranslation) {
            alert('Please enter your translation');
            return;
        }

        this.setLoading(true);
        this.hideEvaluation();

        try {
            const evaluation = await this.evaluateUserTranslation(
                originalText,
                userTranslation,
                this.sourceLang.value,
                this.targetLang.value
            );

            // Store context for conversation
            this.currentOriginalText = originalText;
            this.currentTranslation = userTranslation;
            this.currentEvaluation = evaluation;

            this.displayEvaluation(evaluation);
            this.showEvaluation();
            this.clearConversation();

        } catch (error) {
            console.error('Evaluation error:', error);

            let errorMessage = 'Unknown error occurred';
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else {
                errorMessage = JSON.stringify(error);
            }

            alert(`Evaluation failed: ${errorMessage}`);
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        this.evaluateBtn.disabled = isLoading;
        this.loading.classList.toggle('hidden', !isLoading);

        if (isLoading) {
            this.evaluateBtn.textContent = 'Evaluating...';
        } else {
            this.evaluateBtn.textContent = 'Evaluate Translation';
        }
    }

    getDefaultPrompt() {
        return `You are an expert translation evaluator. Please evaluate the quality of the user's translation from {sourceLang} to {targetLang}.

Original text ({sourceLang}): "{originalText}"
User's translation ({targetLang}): "{userTranslation}"

Please provide a comprehensive evaluation with the following:

1. Overall Quality Score (0-100)
2. Detailed scores for:
   - Accuracy (0-100): How well the translation conveys the original meaning
   - Fluency (0-100): How natural and grammatically correct the translation sounds
   - Naturalness (0-100): How idiomatic and culturally appropriate the translation is
   - Completeness (0-100): Whether all information from the original is preserved

3. Detailed feedback explaining the strengths and areas for improvement

Please respond in the following JSON format:
{
  "overallScore": number,
  "metrics": {
    "accuracy": number,
    "fluency": number,
    "naturalness": number,
    "completeness": number
  },
  "feedback": "detailed explanation of the evaluation"
}`;
    }

    initializeAuth() {
        // No authentication needed - users provide their own API keys
    }

    toggleApiKeyVisibility() {
        const type = this.apiKeyInput.type === 'password' ? 'text' : 'password';
        this.apiKeyInput.type = type;
        this.toggleApiKeyBtn.textContent = type === 'password' ? '👁️' : '🙈';
    }

    initializePrompt() {
        this.evaluationPromptTextarea.value = this.defaultPrompt;
    }


    resetPrompt() {
        this.evaluationPromptTextarea.value = this.defaultPrompt;
    }


    async callClaudeAPI(originalText, userTranslation, sourceLang, targetLang) {
        const apiKey = this.apiKeyInput.value.trim();

        if (!apiKey) {
            throw new Error('Please enter your Claude API key in the settings above.');
        }

        const prompt = this.evaluationPromptTextarea.value
            .replace('{sourceLang}', this.getLanguageName(sourceLang))
            .replace('{targetLang}', this.getLanguageName(targetLang))
            .replace('{originalText}', originalText)
            .replace('{userTranslation}', userTranslation);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = `API Error: ${response.status}`;

            if (errorData.error) {
                if (typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                } else if (errorData.error.message) {
                    errorMessage = errorData.error.message;
                } else {
                    errorMessage = JSON.stringify(errorData.error);
                }
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        const content = data.content[0].text;

        try {
            // Try to parse JSON response - look for JSON block more carefully
            let jsonString = content;

            // Check if it's wrapped in code blocks
            const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
                jsonString = codeBlockMatch[1];
            } else {
                // Look for JSON object in the content
                const jsonMatch = content.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    jsonString = jsonMatch[0];
                }
            }

            const parsed = JSON.parse(jsonString);

            // Validate that we have the expected structure
            if (parsed.overallScore !== undefined && parsed.metrics && parsed.feedback) {
                return parsed;
            } else {
                console.log('JSON missing expected fields, falling back to text parsing');
                return this.parseTextResponse(content);
            }

        } catch (error) {
            console.error('Failed to parse Claude response as JSON:', error);
            console.log('Raw content:', content);
            return this.parseTextResponse(content);
        }
    }

    parseTextResponse(content) {
        // Fallback parser for non-JSON responses

        // If the content looks like it's showing raw JSON to user, extract the readable parts
        if (content.includes('"overallScore"') && content.includes('"feedback"')) {
            // Try to extract JSON values even if it's malformed
            const overallScoreMatch = content.match(/"overallScore":\s*(\d+)/);
            const accuracyMatch = content.match(/"accuracy":\s*(\d+)/);
            const fluencyMatch = content.match(/"fluency":\s*(\d+)/);
            const naturalnessMatch = content.match(/"naturalness":\s*(\d+)/);
            const completenessMatch = content.match(/"completeness":\s*(\d+)/);
            const feedbackMatch = content.match(/"feedback":\s*"((?:[^"\\]|\\.)*)"/);

            let feedback = "Translation evaluation completed. Please see the scores above for detailed assessment.";
            if (feedbackMatch) {
                // Replace escaped newlines with actual newlines
                feedback = feedbackMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
            }

            return {
                overallScore: overallScoreMatch ? parseInt(overallScoreMatch[1]) : 75,
                metrics: {
                    accuracy: accuracyMatch ? parseInt(accuracyMatch[1]) : 75,
                    fluency: fluencyMatch ? parseInt(fluencyMatch[1]) : 75,
                    naturalness: naturalnessMatch ? parseInt(naturalnessMatch[1]) : 75,
                    completeness: completenessMatch ? parseInt(completenessMatch[1]) : 75
                },
                feedback: feedback
            };
        }

        // Original text parsing for natural language responses
        const scoreMatch = content.match(/overall.*?(\d+)/i);
        const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;

        const accuracyMatch = content.match(/accuracy.*?(\d+)/i);
        const fluencyMatch = content.match(/fluency.*?(\d+)/i);
        const naturalnessMatch = content.match(/naturalness.*?(\d+)/i);
        const completenessMatch = content.match(/completeness.*?(\d+)/i);

        return {
            overallScore,
            metrics: {
                accuracy: accuracyMatch ? parseInt(accuracyMatch[1]) : 75,
                fluency: fluencyMatch ? parseInt(fluencyMatch[1]) : 75,
                naturalness: naturalnessMatch ? parseInt(naturalnessMatch[1]) : 75,
                completeness: completenessMatch ? parseInt(completenessMatch[1]) : 75
            },
            feedback: content
        };
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi'
        };
        return languages[code] || code;
    }

    async evaluateUserTranslation(originalText, userTranslation, sourceLang, targetLang) {
        try {
            return await this.callClaudeAPI(originalText, userTranslation, sourceLang, targetLang);
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }

    displayEvaluation(evaluation) {
        this.qualityScore.textContent = `${evaluation.overallScore}/100`;
        this.qualityScore.style.color = this.getScoreColor(evaluation.overallScore);
        this.qualityScore.style.backgroundColor = this.getScoreBackgroundColor(evaluation.overallScore);

        this.evaluationMetrics.innerHTML = '';
        Object.entries(evaluation.metrics).forEach(([metric, value]) => {
            const metricElement = document.createElement('div');
            metricElement.className = 'metric-item';
            metricElement.innerHTML = `
                <span class="metric-label">${this.capitalizeFirst(metric)}:</span>
                <span class="metric-value" style="color: ${this.getScoreColor(value)}">${value}/100</span>
            `;
            this.evaluationMetrics.appendChild(metricElement);
        });

        this.aiFeedback.textContent = evaluation.feedback;
    }

    getScoreColor(score) {
        if (score >= 85) return '#28a745';
        if (score >= 70) return '#ffc107';
        if (score >= 50) return '#fd7e14';
        return '#dc3545';
    }

    getScoreBackgroundColor(score) {
        if (score >= 85) return '#d4edda';
        if (score >= 70) return '#fff3cd';
        if (score >= 50) return '#fde8d8';
        return '#f8d7da';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearConversation() {
        this.conversationHistory.innerHTML = '';
    }

    async sendConversationMessage() {
        const message = this.conversationMessage.value.trim();
        if (!message) return;

        // Add user message to history
        this.addMessageToHistory('user', message);

        // Clear input and disable button
        this.conversationMessage.value = '';
        this.sendMessageBtn.disabled = true;
        this.sendMessageBtn.textContent = 'Sending...';

        try {
            // Create conversation prompt with context
            const conversationPrompt = this.buildConversationPrompt(message);

            // Call Claude API for conversation
            const response = await this.callClaudeForConversation(conversationPrompt);

            // Add AI response to history
            this.addMessageToHistory('ai', response);

        } catch (error) {
            console.error('Conversation error:', error);

            let errorMessage = 'Sorry, I encountered an error. Please try again.';
            if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            this.addMessageToHistory('error', errorMessage);
        } finally {
            this.sendMessageBtn.disabled = false;
            this.sendMessageBtn.textContent = 'Send';
        }
    }

    buildConversationPrompt(userMessage) {
        return `You are helping a user discuss their translation evaluation. Here's the context:

Original text (${this.getLanguageName(this.sourceLang.value)}): "${this.currentOriginalText}"
User's translation (${this.getLanguageName(this.targetLang.value)}): "${this.currentTranslation}"

Previous evaluation:
- Overall Score: ${this.currentEvaluation?.overallScore || 'N/A'}/100
- Accuracy: ${this.currentEvaluation?.metrics?.accuracy || 'N/A'}/100
- Fluency: ${this.currentEvaluation?.metrics?.fluency || 'N/A'}/100
- Naturalness: ${this.currentEvaluation?.metrics?.naturalness || 'N/A'}/100
- Completeness: ${this.currentEvaluation?.metrics?.completeness || 'N/A'}/100
- Previous feedback: ${this.currentEvaluation?.feedback || 'N/A'}

User's question: "${userMessage}"

Please provide a helpful, conversational response about their translation. You can:
- Explain specific aspects of the evaluation
- Suggest improvements
- Discuss language nuances
- Answer questions about translation techniques
- Provide alternative translations

Keep your response concise and focused on their specific question.`;
    }

    async callClaudeForConversation(prompt) {
        const apiKey = this.apiKeyInput.value.trim();

        if (!apiKey) {
            throw new Error('Please set up your API key first.');
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    addMessageToHistory(type, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `conversation-message ${type}-message`;

        const header = document.createElement('div');
        header.className = 'message-header';
        header.textContent = type === 'user' ? 'You:' : type === 'error' ? 'Error:' : 'AI:';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.style.whiteSpace = 'pre-wrap';
        content.textContent = message;

        messageDiv.appendChild(header);
        messageDiv.appendChild(content);
        this.conversationHistory.appendChild(messageDiv);

        // Scroll to bottom
        this.conversationHistory.scrollTop = this.conversationHistory.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TranslationEvaluator();
});