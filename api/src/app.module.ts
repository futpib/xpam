import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { TelegramBotService } from './telegram-bot.service';

@Module({
	imports: [ConfigModule.forRoot()],
	controllers: [AppController],
	providers: [
		AppService,
		PrismaService,
		TelegramBotService,
	],
})
export class AppModule {}
