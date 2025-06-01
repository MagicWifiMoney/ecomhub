const OPENROUTER_API_KEY = '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';
const OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324:free';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

document.addEventListener('DOMContentLoaded', () => {
    const adGeneratorForm = document.getElementById('adGeneratorForm');
    const generateButton = document.getElementById('generateButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessageContainer = document.getElementById('errorMessage');
    const errorMessageText = document.getElementById('errorMessageText');
    const formErrorMessage = document.getElementById('formErrorMessage');
    const adResultsContainer = document.getElementById('adResultsContainer');

    if (adGeneratorForm) {
        adGeneratorForm.addEventListener('submit', handleSubmit);
    }

    function displayLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            generateButton.disabled = true;
            generateButton.classList.add('opacity-50', 'cursor-not-allowed');
            adResultsContainer.innerHTML = '';
            errorMessageContainer.classList.add('hidden');
            formErrorMessage.classList.add('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
            generateButton.disabled = false;
            generateButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    function displayError(message, isFormError = false) {
        if (isFormError) {
            formErrorMessage.textContent = message;
            formErrorMessage.classList.remove('hidden');
        } else {
            errorMessageText.textContent = message;
            errorMessageContainer.classList.remove('hidden');
        }
    }

    function validateForm(data) {
        if (!data.productName || !data.productDescription || !data.targetAudience || !data.adTone) {
            displayError('All fields except "Number of Variations" are required.', true);
            return false;
        }
        if (data.numVariations < 1 || data.numVariations > 5) {
            displayError('Number of variations must be between 1 and 5.', true);
            return false;
        }
        return true;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        displayLoading(true);

        const formData = new FormData(adGeneratorForm);
        const productData = {
            productName: formData.get('productName').trim(),
            productDescription: formData.get('productDescription').trim(),
            targetAudience: formData.get('targetAudience').trim(),
            adTone: formData.get('adTone'),
            numVariations: parseInt(formData.get('numVariations'), 10)
        };

        if (!validateForm(productData)) {
            displayLoading(false);
            return;
        }
        
        const prompt = constructPrompt(productData);

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const aiContent = data.choices[0]?.message?.content;

            if (!aiContent) {
                throw new Error('No content received from AI.');
            }
            
            parseAndDisplayResults(aiContent);

        } catch (error) {
            console.error('Error generating ad copy:', error);
            displayError(error.message || 'Failed to generate ad copy. Please try again.');
        } finally {
            displayLoading(false);
        }
    }

    function constructPrompt({ productName, productDescription, targetAudience, adTone, numVariations }) {
        return `You are an expert advertising copywriter. Generate exactly ${numVariations} distinct ad variations for the following product/service. Each variation MUST include a headline, body text, and a call-to-action (CTA).

Product/Service Name: "${productName}"
Product/Service Description: "${productDescription}"
Target Audience: "${targetAudience}"
Desired Tone: "${adTone}"

Provide your response formatted as a single JSON object. The JSON object must have one top-level key: "variations". The value of "variations" must be an array of ${numVariations} objects. Each object in this array must have exactly three string keys: "headline", "body", and "cta". Do not include any markdown formatting (like \`\`\`json), introductory text, or explanations outside of this JSON object. The entire response should be only the JSON object.`;
    }
    
    function parseAndDisplayResults(aiResponseContent) {
        try {
            let jsonData;
            const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
                 jsonData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No valid JSON object found in AI response.");
            }

            if (!jsonData.variations || !Array.isArray(jsonData.variations)) {
                throw new Error("AI response does not contain a 'variations' array.");
            }

            adResultsContainer.innerHTML = ''; 
            jsonData.variations.forEach((variation, index) => {
                if (!variation.headline || !variation.body || !variation.cta) {
                    console.warn(`Variation ${index + 1} is missing required fields.`);
                    return; 
                }

                const card = document.createElement('div');
                card.className = 'bg-brand-gray p-6 rounded-lg shadow-xl animate-fadeIn';
                
                const title = document.createElement('h3');
                title.className = 'text-xl font-semibold text-brand-primary mb-2';
                title.textContent = `Variation ${index + 1}: ${variation.headline}`;
                
                const body = document.createElement('p');
                body.className = 'text-gray-300 mb-3';
                body.textContent = variation.body;
                
                const cta = document.createElement('p');
                cta.className = 'text-sm font-medium text-brand-secondary';
                cta.innerHTML = `<strong>CTA:</strong> ${variation.cta}`;
                
                card.appendChild(title);
                card.appendChild(body);
                card.appendChild(cta);
                adResultsContainer.appendChild(card);
            });
            
            if (adResultsContainer.children.length === 0 && jsonData.variations.length > 0) {
                 throw new Error("Failed to parse some or all ad variations correctly. Check console for details.");
            } else if (adResultsContainer.children.length === 0) {
                 throw new Error("AI generated content but it could not be parsed into valid ad variations.");
            }

        } catch (error) {
            console.error('Error parsing or displaying results:', error);
            displayError(`Failed to parse AI response: ${error.message}. Raw response: ${aiResponseContent.substring(0,300)}...`);
            adResultsContainer.innerHTML = `<div class="bg-brand-gray p-4 rounded-lg shadow-xl"><p class="text-gray-300">Received data from AI, but it was not in the expected format. Please try again or adjust your query. </p><p class="text-xs text-gray-500 mt-2">Details: ${error.message}</p></div>`;
        }
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
        animation: fadeIn 0.5s ease-out forwards;
    }
`;
document.head.appendChild(style);

