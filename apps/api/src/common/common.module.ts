import { Global, Module } from '@nestjs/common';
import { StateTransitionService } from './services/state-transition.service';

@Global()
@Module({
    providers: [StateTransitionService],
    exports: [StateTransitionService],
})
export class CommonModule { }
