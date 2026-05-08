import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { GraphqlBaseResponse, PaginationInfo } from '@bts-soft/core';
import { Project } from '../models/project.model';

@ObjectType()
export class ProjectResponse extends GraphqlBaseResponse {
  @Field(() => Project, { nullable: true })
  @Expose()
  data?: Project | null;
}

@ObjectType()
export class ProjectsResponse extends GraphqlBaseResponse {
  @Field(() => [Project], { nullable: true })
  items: Project[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}
