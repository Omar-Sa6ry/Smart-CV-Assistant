import { InputType, PartialType } from '@nestjs/graphql';
import { CreateProjectInput } from './createProject.input';

@InputType()
export class UpdateProjectInput extends PartialType(CreateProjectInput) {}
