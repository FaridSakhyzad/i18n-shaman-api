import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { SearchService } from './search.service';
import { IKey } from './interfaces/key.interface';

@Controller()
export class SearchController {
  constructor(private readonly SearchService: SearchService) {}

  @Get('search')
  getUserProjects(
    @Query('projectId') projectId: string,
    @Query('value') value: string,
    @Query('casing') casing: string,
    @Query('exact') exact: string,
    @Req() req,
  ): Promise<IKey[]> {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.SearchService.performSearch({
      projectId,
      value,
      casing: casing === 'true',
      exact: exact === 'true',
    });
  }
}
