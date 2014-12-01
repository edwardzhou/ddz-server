ActiveAdmin.register GameRoom do

  permit_params do
    permitted = []
    permitted << :roomId
    permitted << :roomName
    permitted << :roomDesc
    permitted << :roomType
    permitted << :state
    permitted << :ante
    permitted << :rake
    permitted << :minCoinsQty
    permitted << :maxCoinsQty
    permitted << :sortIndex
    permitted << :readyTimeout
    permitted << :grabbingLordTimeout
    permitted << :playCardTimeout
    permitted
  end

  index do
    selectable_column
    id_column
    column :roomId
    column :roomName
    column :roomDesc
    column :roomType
    column :state
    column :ante
    column :rake
    column :minCoinsQty
    column :maxCoinsQty
    column :sortIndex
    column :readyTimeout
    column :grabbingLordTimeout
    column :playCardTimeout
    column :createAt
    column :updateAt
    actions
  end

  filter :roomId, as: :numeric
  filter :roomName
  filter :roomDesc
  filter :state

  form do |f|
    f.inputs "Game Room Details" do
      f.input :roomId
      f.input :roomName
      f.input :roomDesc, as: "text"
      f.input :roomType
      f.input :state
      f.input :ante
      f.input :rake
      f.input :maxCoinsQty
      f.input :minCoinsQty
      f.input :sortIndex
      f.input :readyTimeout
      f.input :grabbingLordTimeout
      f.input :playCardTimeout
    end
    f.actions
  end


  collection_action :refresh_rooms, :method => :get do
    # Do some CSV importing work here...
    PubSubEvent.create({
                           eventName: 'reload_cache',
                           eventData: {reloadTarget: 'rooms'},
                           active: 1
                       })
    redirect_to({:action => :index}, {:notice => "Post Game Rooms refresh event successfully!"})
  end

  sidebar :operation do
    ul do
      li link_to "Refresh Game Rooms in GAME SERVER", refresh_rooms_admin_game_rooms_path
    end
  end


end
