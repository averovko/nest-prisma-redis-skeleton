import { UserDto } from './user.output';
import { User } from '../../domain/entities/user.entity';

export class ProfileDto extends UserDto {
  static fromApplication(user: User): ProfileDto {
    return {
      id: user.id,
      authId: user.authId,
      firstName: user.firstName,
      lastName: user.lastName ?? '',
      avatar: user.avatar,
      roles: user.roles,
      isActive: user.isActive,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
