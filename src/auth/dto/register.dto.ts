export class RegisterDto {
  email: string;
  password: string;
}

export class SetNewPasswordDto {
  password: string;
  resetToken: string;
  securityToken: string;
}
