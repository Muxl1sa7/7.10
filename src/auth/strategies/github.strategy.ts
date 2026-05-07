import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || 'GITHUB_CLIENT_ID_NOT_SET',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || 'GITHUB_CLIENT_SECRET_NOT_SET',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:3000/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
    const user = {
      githubId: profile.id,
      email,
      fullName: profile.displayName || profile.username,
      photo: profile.photos?.[0]?.value || null,
      provider: 'github',
    };
    done(null, user);
  }
}
