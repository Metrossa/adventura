const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint to handle trip planning
app.post('/plan-trip', async (req, res) => {
    const { destination, preferences } = req.body;

    // Construct the prompt based on user input
    const prompt = `As a travel planner, create three different plans for the morning, afternoon, and evening in ${destination}. 
The traveler prefers a ${preferences.budget} budget and is traveling as a ${preferences.traveler}.

Provide the response as a JSON object with the following structure:

{
  "morning": [
    {"title": "Activity Title", "description": "Brief description"},
    {"title": "Activity Title", "description": "Brief description"},
    {"title": "Activity Title", "description": "Brief description"}
  ],
  "afternoon": [
    {"title": "Activity Title", "description": "Brief description"},
    {"title": "Activity Title", "description": "Brief description"},
    {"title": "Activity Title", "description": "Brief description"}
  ],
  "evening": [
    {"title": "Activity Title", "description": "Brief description"},
    {"title": "Activity Title", "description": "Brief description"},
    {"title": "Activity Title", "description": "Brief description"}
  ]
}

Ensure that the response is valid JSON and does not include any additional text or formatting outside of the JSON object.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that provides travel plans in JSON format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });

        // Parse the JSON response
        const planText = completion.choices[0].message.content.trim();
        let planJSON;
        try {
            planJSON = JSON.parse(planText);
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.error('Response text:', planText);
            return res.status(500).json({ error: 'Failed to parse plan JSON.' });
        }

        res.json({ plan: planJSON });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'An error occurred while generating the plan.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});