import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly SearchService: SearchService) {}

  @Get('search')
  getUserProjects(
    @Query('projectId') projectId: string,
    @Query('query') searchQuery: string,
    @Query('case_sensitive') caseSensitive: string,
    @Query('exact') exact: string,
    @Query('in_keys') inKeys: string,
    @Query('in_values') inValues: string,
    @Query('in_folders') inFolders: string,
    @Query('in_components') inComponents: string,
    @Req() req,
  ) {
    const { session, sessionID } = req;

    if (!session || !sessionID || !session.userId) {
      throw new UnauthorizedException('Error: Denied');
    }

    return this.SearchService.performSearch({
      userId: session.userId,
      projectId,
      searchQuery,
      caseSensitive: caseSensitive === 'true',
      exact: exact === 'true',
      inKeys: inKeys !== 'false',
      inValues: inValues !== 'false',
      inFolders: inFolders !== 'false',
      inComponents: inComponents !== 'false',
    });
  }
}
