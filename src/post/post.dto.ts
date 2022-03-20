import { IsEnum, IsString, Length } from 'class-validator';
import { VoteEnum } from './post.model';

export class CreatePostDto {
  @IsString()
  @Length(1)
  public description: string;

  public image: any;
}

export class VotePostDTO {
  @IsEnum(VoteEnum)
  public dir: number;
}
