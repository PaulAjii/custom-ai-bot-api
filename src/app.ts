import express, { Application, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import 'dotenv/config';

import chatRouter from './routes/chat.js';

const app: Application = express();

const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
	res.status(StatusCodes.OK).json({
		status: 'Success',
		message: 'Welcome to the Express Chatbot AI',
	});
});

app.use('/api/v1/chat', chatRouter);

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
