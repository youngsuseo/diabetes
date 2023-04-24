const express = require('express');
const serverless = require('serverless-http');
const app = express();
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

const corsOptions = {
    origin: 'https://diabetes-meals.pages.dev',
    credentials: true
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.send('Hello World')
});

app.post('/foods', async function (req, res) {
    let { userMessages, assistantMessages } = req.body

    let messages = [
        {
            role: "system",
            content: "You are an expert providing information on dietary management for individuals with diabetes. " +
                "When answering a user's question, please include relevant research paper sources. " +
                "If the user asks about whether they can eat a certain food, provide information on whether it's good to eat, " +
                "any precautions, and alternatives if available. Answer in Korean"
        }
    ];

    while (!!userMessages && userMessages.length !== 0 || !!assistantMessages && assistantMessages.length !== 0) {
        if (!!userMessages &&userMessages.length !== 0) {
            messages.push(
                JSON.parse('{"role": "user", "content": "' + String(userMessages.shift()).replace(/\n/g,"") + '"}')
            )
        }
        if (!!assistantMessages && assistantMessages.length !== 0) {
            messages.push(
                JSON.parse('{"role": "assistant", "content": "' + String(assistantMessages.shift()).replace(/\n/g,"") + '"}')
            )
        }
    }

    const maxRetries = 3;
    let retries = 0;
    let completion
    while (retries < maxRetries) {
        try {
            completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: messages,
            });
            break;
        } catch (e) {
            retries++;
            console.log(e);
            console.log(`Retrying... ${retries} / ${maxRetries}`);
        }
    }

    let content = completion.data.choices[0].message['content'];
    res.json(content);
});

// 식단 추천 api
app.post('/meals', async function (req, res) {
    let { chatMessage } = req.body;

    let todayDateTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: `You are an expert in providing specific food lists for breakfast, lunch, and dinner for people with diabetes. Please suggest a Korean diet to help them eat healthy and manage their diabetes, and today is ${todayDateTime}. Also, please provide the number of servings (g) and calorie (kcal) values. Based on the text in ${chatMessage}, please organize a good diet for diabetics for today. For example, please provide it in JSON format as below. Don't copy the JSON values, just write them in the same format. We don't need the rest of the sentence, just the JSON part. Answer in Korean`
                + "[{\"meal\": \"morning\", \"title\": \"Oatmeal (50g, 150kcal), Banana (30g, 130kcal), Yogurt (25g, 200kcal)\", \"start\": \"2023-04-21T07:30:00\", \"end\": \"2023-04-21T08:00:00\"}, {\"meal\": \"lunch\", \"title\": \"Bean paste soup (400g, 550kcal), Radish wraps (30g, 70kcal), Grilled fish (70g, 250kcal)\", \"start\": \"2023-04-21T12:00:00\", \"end\": \"2023-04-21T13:30:00\"}, {\"meal\": \"dinner\", \"title\": \"Bean paste soup (400g, 550kcal), Radish wraps (30g, 70kcal), Grilled fish (70g, 250kcal)\", \"start\": \"2023-04-21T18:00:00\", \"end\": \"2023-04-21T19:00:00\"}]"},
            {role: "user", content: "Just give me the JSON data, no other sentences."}
        ],
    });
    let content = completion.data.choices[0].message.content;
    res.json(content);
})

module.exports.handler = serverless(app);

// app.listen(3000);