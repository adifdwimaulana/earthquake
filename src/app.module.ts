import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { EarthquakeModule } from "@/module/earthquake/earthquake.module";

@Module({
	imports: [ConfigModule.forRoot(), EarthquakeModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
