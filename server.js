const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 10000;

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
The traveler has a budget of $${preferences.budget} per day and is traveling as a ${preferences.traveler}.
They prefer ${preferences.environment === 'both' ? 'a mix of city and nature' : preferences.environment} environments and want a ${preferences.activity} experience.

Provide the response as a JSON object with the following structure (note: no trailing commas):

{
  "morning": [
    {"title": "Activity 1", "description": "Description 1"},
    {"title": "Activity 2", "description": "Description 2"},
    {"title": "Activity 3", "description": "Description 3"}
  ],
  "afternoon": [
    {"title": "Activity 1", "description": "Description 1"},
    {"title": "Activity 2", "description": "Description 2"},
    {"title": "Activity 3", "description": "Description 3"}
  ],
  "evening": [
    {"title": "Activity 1", "description": "Description 1"},
    {"title": "Activity 2", "description": "Description 2"},
    {"title": "Activity 3", "description": "Description 3"}
  ]
}

Important: Ensure activities match the traveler's ${preferences.environment} preference and ${preferences.activity} activity level. Do not include trailing commas after the last item in arrays. Ensure the response is valid JSON format.`;

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