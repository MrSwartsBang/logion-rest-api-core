import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("session")
export class SessionAggregateRoot {

    @PrimaryColumn({ length: 255, name: "user_address" })
    userAddress?: string;

    @Column({ name: "session_id", type: "uuid" })
    sessionId?: string;

    @Column("timestamp without time zone", { name: "created_on", nullable: true })
    createdOn?: Date;
}
