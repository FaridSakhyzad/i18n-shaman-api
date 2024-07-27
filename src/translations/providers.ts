import { Connection } from 'mongoose';
import { ProjectSchema } from './schemas/Project.schema';
import { KeySchema } from './schemas/Key.schema';

export const Providers = [
  {
    provide: 'PROJECT_MODEL',
    useFactory: (connection: Connection) => connection.model('Project', ProjectSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'KEY_MODEL',
    useFactory: (connection: Connection) => connection.model('Key', KeySchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
