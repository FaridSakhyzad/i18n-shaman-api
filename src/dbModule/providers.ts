import { Connection } from 'mongoose';
import { ProjectSchema } from '../translations/schemas/Project.schema';
import { KeySchema } from '../translations/schemas/Key.schema';
import { UserSchema } from '../user/schemas/User.schema';
import { RawLanguageSchema } from '../translations/schemas/RawLanguage.schema';

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
  {
    provide: 'RAW_LANGUAGE_MODEL',
    useFactory: (connection: Connection) => connection.model('Language', RawLanguageSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'USER_MODEL',
    useFactory: (connection: Connection) => connection.model('User', UserSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
