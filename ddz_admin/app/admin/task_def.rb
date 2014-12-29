ActiveAdmin.register TaskDef do


  permit_params do
    permitted = []
    permitted << :taskId
    permitted << :taskName
    permitted << :taskDesc
    permitted << :taskType
    permitted << :taskIcon
    permitted << :taskBonusDesc
    permitted << :taskTrigger
    permitted << :taskProcessor
    permitted << :enabled
    permitted << :sortIndex
    permitted << :progress
    permitted << :progressDesc
    permitted << :taskData_hash
    permitted
  end

  index do
    selectable_column
    id_column
    column :taskId
    column :taskName
    column :taskDesc
    column :taskType
    column :taskIcon
    column :taskBonusDesc
    column :taskTrigger
    column :taskProcessor
    column :enabled
    column :sortIndex
    column :progress
    column :progressDesc
    column :taskData_hash
    column :created_at
    column :updated_at
    actions
  end

  filter :taskId
  filter :taskName
  filter :taskDesc
  filter :taskType

  form do |f|
    f.inputs "TaskDef Details" do
      f.input :taskId
      f.input :taskName
      f.input :taskDesc
      f.input :taskType
      f.input :taskIcon
      f.input :taskBonusDesc
      f.input :taskTrigger
      f.input :taskProcessor
      f.input :enabled
      f.input :sortIndex
      f.input :progress
      f.input :progressDesc
      f.input :taskData_hash, as: :text
    end

    f.actions
  end

end
