import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly SearchService: SearchService) {}

  @Get('search')
  getUserProjects(
    @Query('projectId') projectId: string,
    @Query('query') searchQuery: string,
    @Query('casing') casing: string,
    @Query('exact') exact: string,
    @Req() req,
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.SearchService.performSearch({
      projectId,
      searchQuery,
      casing: casing === 'true',
      exact: exact === 'true',
    });
  }
}
