import { Controller, Post } from '@nestjs/common';
import { GameGateway } from './game.gateway';

@Controller('game')
export class GameController {
  constructor(private readonly gameGateway: GameGateway) {}

  @Post('start')
  startGame(): string {
    this.gameGateway.handleStartGame();
    return 'Game started!';
  }

  @Post('draw')
  drawNumber(): string {
    this.gameGateway.handleDrawNumber();
    return 'Number drawn!';
  }
}
