import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  async exportAll(@Res() res: Response) {
    const backup = await this.backupService.exportAll();

    const filename = `spinner-backup-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  }

  @Post('import')
  async importAll(@Body() data: any) {
    return this.backupService.importAll(data);
  }
}
