import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { graph } from './../api/index.js';

export const chatController = async (req: Request, res: Response) => {
	try {
		const { prompt } = req.body;

		if (!prompt) {
			res.status(StatusCodes.BAD_REQUEST).json({
				status: 'Error',
				message: 'Prompt is required',
			});
			return;
		}

		const result = await graph.invoke({
			question: prompt,
		});

		res.status(StatusCodes.OK).json({
			status: 'Success',
			message: result.answer,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: 'Error',
			message:
				error instanceof Error ? error.message : 'An error occurred',
		});
	}
};
