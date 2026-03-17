import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current User decorator
 * Extracts user from request object (set by JWT strategy)
 *
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
