ActiveAdmin.register User do

  permit_params do
    permitted = []
    permitted << :nickName
    permitted << :mobileNo
    permitted << :email
    permitted << :headIcon
    permitted << :gender
    permitted << :password
    permitted << :appid
    permitted << :appVersion
    permitted << :resVersion
    permitted << :robot
    permitted << :robot_busy
    permitted << :locked
    permitted << :lockedAt
    permitted << :comment
    permitted
  end

  index do
    selectable_column
    id_column
    column :userId
    column :nickName
    column :mobileNo
    column :email
    column :headIcon
    column :gender
    column :appid
    column :channel
    column :appVersion
    column :resVersion
    column :robot
    column :robot_busy
    column :locked
    column :lockedAt
    column :comment
    column :createAt
    column :updateAt
    actions
  end

  filter :userId, as: :numeric
  filter :nickName
  filter :mobileNo
  filter :email

  form do |f|
    f.inputs "Game Room Details" do

      f.input :nickName
      f.input :mobileNo
      f.input :email
      f.input :headIcon
      f.input :gender
      f.input :appid
      f.input :appVersion
      f.input :resVersion
      f.input :robot
      f.input :robot_busy
      f.input :locked
      f.input :lockedAt
      f.input :comment
    end
    f.actions
  end
end
