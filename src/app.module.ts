import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { GameGateway } from './game/game.gateway';
import { GameController } from './game/game.controller';
import { TicketService } from './ticket/ticket.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

console.log(join(__dirname, '..', 'html'));

@Module({
  imports: [TicketModule, ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'html'),
    // renderPath: 'html',
  }),],
  controllers: [AppController, GameController],
  providers: [AppService, GameGateway, TicketService],
})
export class AppModule {}
