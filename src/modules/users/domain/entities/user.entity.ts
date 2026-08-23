export interface UserProps {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private constructor(
    private readonly id: string,
    private props: UserProps,
  ) {}

  public static create(props: CreateUserProps): User {
    const now = new Date();

    return new User(props.id, {
      name: props.name,
      email: props.email,
      passwordHash: props.passwordHash,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.props.name;
  }

  public getEmail(): string {
    return this.props.email;
  }

  public getPasswordHash(): string {
    return this.props.passwordHash;
  }

  public getCreatedAt(): Date {
    return new Date(this.props.createdAt);
  }

  public getUpdatedAt(): Date {
    return new Date(this.props.updatedAt);
  }
}
