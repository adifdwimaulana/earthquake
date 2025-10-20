import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EarthquakeController } from "./earthquake.controller";

@Module({
	imports: [ConfigModule],
	controllers: [EarthquakeController],
})
export class EarthquakeModule {}
