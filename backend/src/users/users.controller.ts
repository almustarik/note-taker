import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Types } from 'mongoose';
import { CurrentUser, Roles } from '../common/decorators.js';
import { PaginationDto } from '../common/pagination.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { Role } from '../common/role.enum.js';
import type { AuthUser } from '../common/role.enum.js';
import { CreateUserDto, InterestsQueryDto, UpdateUserDto } from './dto/user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('interests')
  groupByInterests(@Query() query: InterestsQueryDto) {
    return this.usersService.groupByInterests(query);
  }

  @Get(':id/posts')
  findPosts(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Query() query: PaginationDto) {
    return this.usersService.findPostsByUser(id, query);
  }

  @Roles(Role.Admin)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Roles(Role.Admin)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles(Role.Admin)
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  update(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.adminUpdate(admin, id, dto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() admin: AuthUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.usersService.remove(admin, id);
  }
}
