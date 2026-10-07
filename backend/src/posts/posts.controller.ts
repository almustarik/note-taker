import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators.js';
import { PaginationDto } from '../common/pagination.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import type { AuthUser } from '../common/role.enum.js';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto.js';
import { PostsService } from './posts.service.js';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.postsService.findAll(query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.postsService.remove(user, id);
  }
}
