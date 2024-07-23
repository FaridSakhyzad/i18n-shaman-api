import { Connection } from 'mongoose';
import { ProjectSchema } from './schemas/Project.schema';

export const Providers = [
  {
    provide: 'PROJECT_MODEL',
    useFactory: (connection: Connection) => connection.model('Project', ProjectSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
