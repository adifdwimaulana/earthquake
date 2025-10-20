import { IsNumber, IsString } from "class-validator";

export class EarthquakeParams {
	@IsNumber()
	magnitude: number;

	@IsString()
	location: string;

	@IsNumber()
	timestamp: number;
}
